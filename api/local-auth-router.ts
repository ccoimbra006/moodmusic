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

// Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("A senha deve ter pelo menos 8 caracteres");
  if (!/[A-Z]/.test(password)) errors.push("A senha deve ter pelo menos 1 letra maiuscula");
  if (!/[a-z]/.test(password)) errors.push("A senha deve ter pelo menos 1 letra minuscula");
  if (!/[0-9]/.test(password)) errors.push("A senha deve ter pelo menos 1 numero");
  return { valid: errors.length === 0, errors };
}

// Generate random confirmation token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        password: z.string().min(8).max(100),
        confirmPassword: z.string().min(8).max(100),
      })
    )
    .mutation(async ({ input }) => {
      // Check passwords match
      if (input.password !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As senhas nao coincidem",
        });
      }

      // Validate password strength
      const pwCheck = validatePassword(input.password);
      if (!pwCheck.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: pwCheck.errors.join(". "),
        });
      }

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
      const confirmationToken = generateToken();

      // Insert user with emailConfirmed = 0
      const result = await db.insert(schema.users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        confirmationToken,
        emailConfirmed: 0,
        lastSignInAt: new Date(),
      }).returning();

      const userId = result[0]?.id;
      if (!userId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar conta" });
      }

      // Generate confirmation link
      const appUrl = env.appUrl || "http://localhost:3000";
      const confirmationLink = `${appUrl}/api/confirm-email?token=${confirmationToken}`;

      console.log(`[Register] User ${userId} created. Confirm: ${confirmationLink}`);

      const token = await createToken(userId);

      return {
        token,
        requiresConfirmation: true,
        confirmationLink,
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

      // Check if email is confirmed
      if (user.emailConfirmed === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Email nao confirmado. Verifica a tua caixa de entrada ou contacta o suporte.",
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
      emailConfirmed: u.emailConfirmed === 1,
    };
  }),

  // Resend confirmation
  resendConfirmation: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, input.email))
        .limit(1);

      if (users.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Email nao encontrado" });
      }

      const user = users[0];
      if (user.emailConfirmed === 1) {
        return { alreadyConfirmed: true };
      }

      // Generate new token
      const newToken = generateToken();
      await db
        .update(schema.users)
        .set({ confirmationToken: newToken })
        .where(eq(schema.users.id, user.id));

      const appUrl = env.appUrl || "http://localhost:3000";
      const confirmationLink = `${appUrl}/api/confirm-email?token=${newToken}`;

      return { alreadyConfirmed: false, confirmationLink };
    }),
});
