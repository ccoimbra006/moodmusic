import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const historyRouter = createRouter({
  getMyHistory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    
    // Get recent activity with song info
    const activities = await db
      .select({
        id: schema.userActivity.id,
        action: schema.userActivity.action,
        metadata: schema.userActivity.metadata,
        createdAt: schema.userActivity.createdAt,
        songId: schema.songs.id,
        songTitle: schema.songs.title,
        songArtist: schema.songs.artist,
        songImage: schema.songs.image,
        songSpotifyId: schema.songs.spotifyId,
      })
      .from(schema.userActivity)
      .leftJoin(schema.songs, eq(schema.userActivity.songId, schema.songs.id))
      .where(eq(schema.userActivity.userId, ctx.user.id))
      .orderBy(desc(schema.userActivity.createdAt))
      .limit(50);

    return activities;
  }),

  getMyStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const totalListens = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.userActivity)
      .where(
        sql`${schema.userActivity.userId} = ${ctx.user.id} AND ${schema.userActivity.action} = 'listen'`
      );

    const totalLikes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.likes)
      .where(
        sql`${schema.likes.userId} = ${ctx.user.id} AND ${schema.likes.type} = 'like'`
      );

    const totalFavorites = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.favorites)
      .where(eq(schema.favorites.userId, ctx.user.id));

    const totalComments = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.comments)
      .where(eq(schema.comments.userId, ctx.user.id));

    const topMoods = await db
      .select({
        mood: schema.moodSelections.mood,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.moodSelections)
      .where(eq(schema.moodSelections.userId, ctx.user.id))
      .groupBy(schema.moodSelections.mood)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5);

    return {
      totalListens: totalListens[0]?.count ?? 0,
      totalLikes: totalLikes[0]?.count ?? 0,
      totalFavorites: totalFavorites[0]?.count ?? 0,
      totalComments: totalComments[0]?.count ?? 0,
      topMoods,
    };
  }),

  record: authedQuery
    .input(
      z.object({
        action: z.enum(["listen", "like", "dislike", "favorite", "comment", "reply", "mood_change", "share"]),
        songId: z.number().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(schema.userActivity).values({
        userId: ctx.user.id,
        songId: input.songId ?? null,
        action: input.action,
        metadata: input.metadata ?? null,
      });
      return { success: true };
    }),
});
