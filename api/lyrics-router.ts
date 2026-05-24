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
        // Try lyrics.ovh API
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(input.artist)}/${encodeURIComponent(input.title)}`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });

        if (!resp.ok) {
          return { lyrics: null, source: null };
        }

        const data = await resp.json() as { lyrics?: string };

        if (!data.lyrics) {
          return { lyrics: null, source: null };
        }

        // Clean up lyrics
        const cleaned = data.lyrics
          .replace(/\r\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        return { lyrics: cleaned, source: "lyrics.ovh" };
      } catch {
        return { lyrics: null, source: null };
      }
    }),
});
