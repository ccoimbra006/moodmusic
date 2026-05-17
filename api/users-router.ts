import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const usersRouter = createRouter({
  me: authedQuery.query(async ({ ctx }) => {
    return ctx.user;
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const user = await db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          avatar: schema.users.avatar,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .where(eq(schema.users.id, input.id))
        .limit(1);
      return user[0] ?? null;
    }),

  updateProfile: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(320).optional(),
        avatar: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const updateData: Partial<typeof schema.users.$inferInsert> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.avatar !== undefined) updateData.avatar = input.avatar;

      await db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, ctx.user.id));

      const updated = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, ctx.user.id))
        .limit(1);

      return updated[0];
    }),
});
