import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

// Clean artist/title for better matching
function cleanTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\{.*?\}/g, "")
    .replace(/feat\..*/gi, "")
    .replace(/ft\..*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanArtist(artist: string): string {
  return artist
    .replace(/\(.*?\)/g, "")
    .replace(/,.*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Try lrclib.net (large open lyrics database)
async function fetchFromLrclib(title: string, artist: string): Promise<string | null> {
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(title + " " + artist)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;

    const data = await resp.json() as { results?: Array<{ plainLyrics?: string; syncedLyrics?: string }> };
    if (!data.results || data.results.length === 0) return null;

    // Use plain lyrics (not synced/timed)
    const lyrics = data.results[0]?.plainLyrics || data.results[0]?.syncedLyrics;
    if (!lyrics || lyrics.length < 20) return null;

    // Clean synced lyrics format if needed
    return lyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim();
  } catch {
    return null;
  }
}

// Try lyrics.ovh
async function fetchFromLyricsOvh(title: string, artist: string): Promise<string | null> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;

    const data = await resp.json() as { lyrics?: string };
    if (!data.lyrics || data.lyrics.length < 20) return null;

    // Clean "Paroles de..." prefix
    return data.lyrics.replace(/Paroles de .*\n?/i, "").trim();
  } catch {
    return null;
  }
}

export const lyricsRouter = createRouter({
  get: publicQuery
    .input(z.object({
      title: z.string().min(1),
      artist: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const cTitle = cleanTitle(input.title);
      const cArtist = cleanArtist(input.artist);

      console.log(`[Lyrics] Searching: "${cArtist}" - "${cTitle}"`);

      // Try lrclib.net first (better database)
      let lyrics = await fetchFromLrclib(cTitle, cArtist);
      let source = "lrclib.net";

      // Fallback to lyrics.ovh
      if (!lyrics) {
        lyrics = await fetchFromLyricsOvh(cTitle, cArtist);
        source = "lyrics.ovh";
      }

      if (lyrics) {
        // Clean up excessive whitespace
        lyrics = lyrics.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
        console.log(`[Lyrics] Found via ${source}! Length: ${lyrics.length}`);
        return { lyrics, source };
      }

      console.log("[Lyrics] Not found in any source");
      return { lyrics: null, source: null };
    }),
});
