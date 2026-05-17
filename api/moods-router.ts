import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const moodsRouter = createRouter({
  getCurrent: authedQuery
    .input(z.object({ songId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const moods = await db
        .select()
        .from(schema.moodSelections)
        .where(
          and(
            eq(schema.moodSelections.songId, input.songId),
            eq(schema.moodSelections.userId, ctx.user.id)
          )
        )
        .orderBy(schema.moodSelections.createdAt)
        .limit(1);

      return moods[0]?.mood ?? "chill";
    }),

  getPopular: publicQuery
    .input(z.object({ songId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          mood: schema.moodSelections.mood,
          count: sql<number>`COUNT(*)`,
        })
        .from(schema.moodSelections)
        .where(eq(schema.moodSelections.songId, input.songId))
        .groupBy(schema.moodSelections.mood)
        .orderBy(sql`COUNT(*) DESC`);

      return result;
    }),

  getMyStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select({
        mood: schema.moodSelections.mood,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.moodSelections)
      .where(eq(schema.moodSelections.userId, ctx.user.id))
      .groupBy(schema.moodSelections.mood)
      .orderBy(sql`COUNT(*) DESC`);

    return result;
  }),

  set: authedQuery
    .input(
      z.object({
        songId: z.number(),
        mood: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      // Remove existing mood for this user+song
      await db
        .delete(schema.moodSelections)
        .where(
          and(
            eq(schema.moodSelections.songId, input.songId),
            eq(schema.moodSelections.userId, ctx.user.id)
          )
        );

      // Insert new
      await db.insert(schema.moodSelections).values({
        songId: input.songId,
        userId: ctx.user.id,
        mood: input.mood,
      });

      return { mood: input.mood };
    }),
});
