import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { env } from "./lib/env";

const JWT_SECRET = new TextEncoder().encode(env.appSecret || "moodtrack-local-secret-key-2026");

async function createToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId), type: "local" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload;
  } catch {
    return null;
  }
}

export { verifyToken };

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        password: z.string().min(6).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if email already exists
      const existing = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email ja esta em uso",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      // Insert and get the ID back (works for both SQLite and MySQL)
      const result = await db.insert(schema.users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        lastSignInAt: new Date(),
      });

      // Get the inserted user ID
      console.log("[Register] Insert result:", JSON.stringify(result));
      let userId: number;
      if (result[0] && (typeof result[0].insertId === "number" || typeof result[0].insertId === "bigint")) {
        userId = Number(result[0].insertId);
        console.log("[Register] Got userId from insertId:", userId);
      } else {
        // Fallback: SQLite sometimes doesn't return insertId, so we select by email
        const inserted = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.email, input.email))
          .limit(1);
        if (inserted.length === 0) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar conta. Tenta novamente." });
        }
        userId = inserted[0].id;
      }

      const token = await createToken(userId);

      return {
        token,
        user: {
          id: userId,
          name: input.name,
          email: input.email,
          role: "user",
        },
      };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, input.email))
        .limit(1);

      if (users.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      const user = users[0];

      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Esta conta usa login social. Use Entrar com Google.",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      // Update last sign in
      await db
        .update(schema.users)
        .set({ lastSignInAt: new Date() })
        .where(eq(schema.users.id, user.id));

      const token = await createToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
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
      name: u.name ?? "Usuario",
      email: u.email ?? "",
      avatar: u.avatar ?? undefined,
      role: u.role,
    };
  }),
});
