import { z } from "zod";
import { eq, desc, gte, lt, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";
import { getSpotifyToken, getAudioFeatures, detectMood } from "./spotify-router";
import { detectMoodFromText } from "./mood-detector";

function getDayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return { start, end };
}

export const songsRouter = createRouter({
  getToday: publicQuery.query(async () => {
    const db = getDb();
    const { start, end } = getDayBounds();

    const songs = await db
      .select()
      .from(schema.songs)
      .where(
        and(
          gte(schema.songs.date, start),
          lt(schema.songs.date, end)
        )
      )
      .orderBy(desc(schema.songs.date))
      .limit(1);

    return songs[0] ?? null;
  }),

  getHistory: publicQuery.query(async () => {
    const db = getDb();
    const { start } = getDayBounds();

    return db
      .select()
      .from(schema.songs)
      .where(lt(schema.songs.date, start))
      .orderBy(desc(schema.songs.date))
      .limit(12);
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const songs = await db
        .select()
        .from(schema.songs)
        .where(eq(schema.songs.id, input.id))
        .limit(1);
      return songs[0] ?? null;
    }),

  create: adminQuery
    .input(
      z.object({
        spotifyId: z.string(),
        title: z.string(),
        artist: z.string(),
        album: z.string().optional(),
        image: z.string().optional(),
        spotifyUrl: z.string().optional(),
        description: z.string().optional(),
        detectedMood: z.string().optional(), // Admin can override mood
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Use admin-selected mood if provided, otherwise auto-detect
      let detectedMood: string | null = input.detectedMood ?? null;

      if (!detectedMood) {
        // Auto-detect mood from Spotify audio features
        try {
          const token = await getSpotifyToken();
          console.log("[MoodDetect] Got Spotify token, fetching audio features for:", input.spotifyId);
          const features = await getAudioFeatures(input.spotifyId, token);
          if (features) {
            detectedMood = detectMood(features.energy, features.valence, input.title, input.artist);
            console.log("[MoodDetect] Energy:", features.energy, "Valence:", features.valence, "=> Mood:", detectedMood);
          } else {
            // Fallback: detect mood from title + artist using keyword matching
            const textMood = detectMoodFromText(input.title, input.artist);
            if (textMood) {
              detectedMood = textMood;
              console.log("[MoodDetect] Using text-based mood detection:", detectedMood);
            } else {
              console.log("[MoodDetect] No audio features found for track:", input.spotifyId);
            }
          }
        } catch (err) {
          console.error("[MoodDetect] Failed to get audio features:", err);
          // If audio features fail, leave detectedMood as null
        }
      } else {
        console.log("[MoodDetect] Using admin-selected mood:", detectedMood);
      }

      // Check if song already exists for today
      const { start, end } = getDayBounds();
      const existing = await db
        .select()
        .from(schema.songs)
        .where(
          and(
            gte(schema.songs.date, start),
            lt(schema.songs.date, end)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(schema.songs)
          .set({
            spotifyId: input.spotifyId,
            title: input.title,
            artist: input.artist,
            album: input.album ?? null,
            image: input.image ?? null,
            spotifyUrl: input.spotifyUrl ?? null,
            description: input.description ?? null,
            detectedMood,
          })
          .where(eq(schema.songs.id, existing[0].id));

        const updated = await db
          .select()
          .from(schema.songs)
          .where(eq(schema.songs.id, existing[0].id))
          .limit(1);

        return updated[0];
      }

      // Create new
      const result = await db.insert(schema.songs).values({
        spotifyId: input.spotifyId,
        title: input.title,
        artist: input.artist,
        album: input.album ?? null,
        image: input.image ?? null,
        spotifyUrl: input.spotifyUrl ?? null,
        description: input.description ?? null,
        detectedMood,
        addedBy: ctx.user.id,
      });

      const insertedId = Number(result[0].insertId);
      const inserted = await db
        .select()
        .from(schema.songs)
        .where(eq(schema.songs.id, insertedId))
        .limit(1);

      return inserted[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(schema.songs).where(eq(schema.songs.id, input.id));
      return { success: true };
    }),
});
