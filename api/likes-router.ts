import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const likesRouter = createRouter({
  getBySong: publicQuery
    .input(z.object({ songId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.likes)
        .where(eq(schema.likes.songId, input.songId));
      
      return { count: countResult[0]?.count ?? 0 };
    }),

  getMyLike: authedQuery
    .input(z.object({ songId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const myLike = await db
        .select()
        .from(schema.likes)
        .where(
          and(
            eq(schema.likes.songId, input.songId),
            eq(schema.likes.userId, ctx.user.id)
          )
        )
        .limit(1);
      
      return myLike[0] ?? null;
    }),

  toggle: authedQuery
    .input(z.object({ songId: z.number(), type: z.enum(["like", "dislike"]).default("like") }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      // Check existing
      const existing = await db
        .select()
        .from(schema.likes)
        .where(
          and(
            eq(schema.likes.songId, input.songId),
            eq(schema.likes.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Remove if same type, otherwise update
        if (existing[0].type === input.type) {
          await db.delete(schema.likes).where(eq(schema.likes.id, existing[0].id));
          return { liked: false, type: null };
        } else {
          await db
            .update(schema.likes)
            .set({ type: input.type })
            .where(eq(schema.likes.id, existing[0].id));
          return { liked: true, type: input.type };
        }
      }

      // Create new
      await db.insert(schema.likes).values({
        songId: input.songId,
        userId: ctx.user.id,
        type: input.type,
      });

      // Update song likes count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.likes)
        .where(
          and(
            eq(schema.likes.songId, input.songId),
            eq(schema.likes.type, "like")
          )
        );
      
      await db
        .update(schema.songs)
        .set({ likesCount: countResult[0]?.count ?? 0 })
        .where(eq(schema.songs.id, input.songId));

      return { liked: true, type: input.type };
    }),
});
