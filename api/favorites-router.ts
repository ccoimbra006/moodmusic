import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const favoritesRouter = createRouter({
  getMyFavorites: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        id: schema.favorites.id,
        createdAt: schema.favorites.createdAt,
        songId: schema.songs.id,
        title: schema.songs.title,
        artist: schema.songs.artist,
        image: schema.songs.image,
        spotifyId: schema.songs.spotifyId,
        date: schema.songs.date,
      })
      .from(schema.favorites)
      .innerJoin(schema.songs, eq(schema.favorites.songId, schema.songs.id))
      .where(eq(schema.favorites.userId, ctx.user.id))
      .orderBy(schema.favorites.createdAt);
  }),

  getBySong: authedQuery
    .input(z.object({ songId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const fav = await db
        .select()
        .from(schema.favorites)
        .where(
          and(
            eq(schema.favorites.songId, input.songId),
            eq(schema.favorites.userId, ctx.user.id)
          )
        )
        .limit(1);
      return fav.length > 0;
    }),

  toggle: authedQuery
    .input(z.object({ songId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(schema.favorites)
        .where(
          and(
            eq(schema.favorites.songId, input.songId),
            eq(schema.favorites.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db.delete(schema.favorites).where(eq(schema.favorites.id, existing[0].id));
        return { favorited: false };
      }

      await db.insert(schema.favorites).values({
        songId: input.songId,
        userId: ctx.user.id,
      });

      return { favorited: true };
    }),
});
