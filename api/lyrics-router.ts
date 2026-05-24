import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

export const lyricsRouter = createRouter({
  get: publicQuery
    .input(z.object({
      title: z.string().min(1),
      artist: z.string().min(1),
    }))
    .query(async ({ input }) => {
      try {
        // Clean up title and artist for better matching
        const cleanTitle = input.title
          .replace(/\(.*?\)/g, "") // Remove parenthesis content
          .replace(/\[.*?\]/g, "")
          .replace(/feat\..*/gi, "")
          .replace(/ft\..*/gi, "")
          .replace(/\s+/g, " ")
          .trim();

        const cleanArtist = input.artist
          .replace(/\(.*?\)/g, "")
          .replace(/,.*/g, "") // Use only first artist
          .replace(/\s+/g, " ")
          .trim();

        console.log("[Lyrics] Searching for:", cleanArtist, "-", cleanTitle);

        // Try lyrics.ovh API with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!resp.ok) {
          console.log("[Lyrics] Not found:", resp.status);
          return { lyrics: null, source: null };
        }

        const data = await resp.json() as { lyrics?: string };

        if (!data.lyrics || data.lyrics.trim().length < 10) {
          return { lyrics: null, source: null };
        }

        // Clean up lyrics - remove excessive newlines and "Paroles de..." prefix
        let cleaned = data.lyrics
          .replace(/Paroles de .*\n?/i, "")
          .replace(/\r\n/g, "\n")
          .replace(/\n{4,}/g, "\n\n\n")
          .trim();

        console.log("[Lyrics] Found! Length:", cleaned.length);
        return { lyrics: cleaned, source: "lyrics.ovh" };

      } catch (err: any) {
        console.error("[Lyrics] Error:", err.message || err);
        return { lyrics: null, source: null };
      }
    }),
});
