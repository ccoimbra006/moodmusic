import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const notificationsRouter = createRouter({
  // Get my notifications
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, ctx.user.id))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);
    return rows;
  }),

  // Get unread count
  unreadCount: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(
        eq(schema.notifications.userId, ctx.user.id) &&
        eq(schema.notifications.read, 0)
      );
    return { count: result[0]?.count ?? 0 };
  }),

  // Mark as read
  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .update(schema.notifications)
        .set({ read: 1 })
        .where(
          eq(schema.notifications.id, input.id) &&
          eq(schema.notifications.userId, ctx.user.id)
        );
      return { success: true };
    }),

  // Mark all as read
  markAllRead: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(schema.notifications)
      .set({ read: 1 })
      .where(eq(schema.notifications.userId, ctx.user.id));
    return { success: true };
  }),

  // Create notification (internal use)
  create: publicQuery
    .input(
      z.object({
        userId: z.number(),
        type: z.string().max(30),
        title: z.string(),
        message: z.string(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(schema.notifications).values(input).returning();
      return result[0];
    }),
});
