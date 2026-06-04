import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

// ── Artist database by mood ──
const MOOD_ARTISTS: Record<string, Array<{ name: string; category: "famous" | "underground"; genres: string[] }>> = {
  chill: [
    { name: "Frank Ocean", category: "famous", genres: ["r&b", "alternative"] },
    { name: "SZA", category: "famous", genres: ["r&b", "soul"] },
    { name: "Daniel Caesar", category: "famous", genres: ["r&b", "soul"] },
    { name: "Brent Faiyaz", category: "underground", genres: ["r&b", "alternative"] },
    { name: "Sabrina Claudio", category: "underground", genres: ["r&b", "ambient"] },
    { name: "Giveon", category: "famous", genres: ["r&b", "soul"] },
    { name: "Snoh Aalegra", category: "underground", genres: ["r&b", "soul"] },
    { name: "Raveena", category: "underground", genres: ["r&b", "indian"] },
    { name: "Pink Sweat$", category: "underground", genres: ["pop", "r&b"] },
    { name: "Kali Uchis", category: "famous", genres: ["r&b", "latin"] },
  ],
  energy: [
    { name: "Drake", category: "famous", genres: ["hip-hop", "rap"] },
    { name: "Travis Scott", category: "famous", genres: ["hip-hop", "trap"] },
    { name: "Future", category: "famous", genres: ["hip-hop", "trap"] },
    { name: "Playboi Carti", category: "famous", genres: ["hip-hop", "trap"] },
    { name: "Ken Carson", category: "underground", genres: ["hip-hop", "rage"] },
    { name: "Yeat", category: "underground", genres: ["hip-hop", "rage"] },
    { name: "Destroy Lonely", category: "underground", genres: ["hip-hop", "trap"] },
    { name: "Lancey Foux", category: "underground", genres: ["hip-hop", "alternative"] },
    { name: "SoFaygo", category: "underground", genres: ["hip-hop", "trap"] },
    { name: "Don Toliver", category: "famous", genres: ["hip-hop", "r&b"] },
  ],
  happy: [
    { name: "Bruno Mars", category: "famous", genres: ["pop", "funk"] },
    { name: "Dua Lipa", category: "famous", genres: ["pop", "dance"] },
    { name: "The Weeknd", category: "famous", genres: ["pop", "r&b"] },
    { name: "Doja Cat", category: "famous", genres: ["pop", "rap"] },
    { name: "Steve Lacy", category: "underground", genres: ["r&b", "indie"] },
    { name: "Rex Orange County", category: "underground", genres: ["indie", "pop"] },
    { name: "Cuco", category: "underground", genres: ["indie", "dream pop"] },
    { name: "Clairo", category: "underground", genres: ["indie", "bedroom pop"] },
    { name: "Dominic Fike", category: "underground", genres: ["indie", "alternative"] },
    { name: "Faye Webster", category: "underground", genres: ["indie", "soul"] },
  ],
  melancholy: [
    { name: "Radiohead", category: "famous", genres: ["alternative", "rock"] },
    { name: "Lana Del Rey", category: "famous", genres: ["alternative", "pop"] },
    { name: "Bon Iver", category: "famous", genres: ["indie folk", "ambient"] },
    { name: "Phoebe Bridgers", category: "famous", genres: ["indie folk", "alternative"] },
    { name: "Elliott Smith", category: "underground", genres: ["indie folk", "singer-songwriter"] },
    { name: "Alex G", category: "underground", genres: ["indie", "lo-fi"] },
    { name: "Sufjan Stevens", category: "underground", genres: ["indie folk", "chamber pop"] },
    { name: "Mitski", category: "famous", genres: ["indie rock", "alternative"] },
    { name: "Julien Baker", category: "underground", genres: ["indie folk", "rock"] },
    { name: "Adrianne Lenker", category: "underground", genres: ["indie folk", "ambient"] },
  ],
  romantic: [
    { name: "Ed Sheeran", category: "famous", genres: ["pop", "acoustic"] },
    { name: "Sam Smith", category: "famous", genres: ["pop", "soul"] },
    { name: "John Legend", category: "famous", genres: ["r&b", "soul"] },
    { name: "Alicia Keys", category: "famous", genres: ["r&b", "soul"] },
    { name: "PinkPantheress", category: "underground", genres: ["bedroom pop", "dnb"] },
    { name: "beabadoobee", category: "underground", genres: ["indie", "bedroom pop"] },
    { name: "Faye Webster", category: "underground", genres: ["indie", "soul"] },
    { name: "Erika de Casier", category: "underground", genres: ["r&b", "pop"] },
    { name: "Raveena", category: "underground", genres: ["r&b", "soul"] },
    { name: "Yuna", category: "underground", genres: ["r&b", "pop"] },
  ],
  focus: [
    { name: "Tycho", category: "famous", genres: ["ambient", "electronic"] },
    { name: "Nujabes", category: "famous", genres: ["jazz hop", "lo-fi"] },
    { name: "Explosions in the Sky", category: "underground", genres: ["post-rock", "ambient"] },
    { name: "Hammock", category: "underground", genres: ["ambient", "post-rock"] },
    { name: "Olafur Arnalds", category: "underground", genres: ["neoclassical", "ambient"] },
    { name: "Max Richter", category: "famous", genres: ["neoclassical", "ambient"] },
    { name: "Helios", category: "underground", genres: ["ambient", "electronic"] },
    { name: "Balmorhea", category: "underground", genres: ["post-rock", "ambient"] },
    { name: "Helios", category: "underground", genres: ["ambient", "electronic"] },
    { name: "Emancipator", category: "underground", genres: ["trip hop", "downtempo"] },
  ],
};

// ── Seed artists to DB ──
async function seedArtists() {
  try {
    const db = getDb();
    const existing = await db.select({ count: sql<number>`count(*)` }).from(schema.moodArtists);
    if ((existing[0]?.count ?? 0) > 0) {
      console.log("[Recommendations] Artists already seeded:", existing[0].count);
      return;
    }

    console.log("[Recommendations] Seeding mood artists...");
    for (const [mood, artists] of Object.entries(MOOD_ARTISTS)) {
      for (const artist of artists) {
        await db.insert(schema.moodArtists).values({
          mood,
          name: artist.name,
          category: artist.category,
          genres: JSON.stringify(artist.genres),
        });
      }
    }
    console.log("[Recommendations] Seeded", Object.values(MOOD_ARTISTS).flat().length, "artists");
  } catch (err: any) {
    console.error("[Recommendations] Seed error:", err.message);
    // If table doesn't exist, seeding will fail but we still return fallback data
  }
}

// ── Spotify token ──
let spotifyToken: { token: string; expires: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  if (spotifyToken && Date.now() < spotifyToken.expires) return spotifyToken.token;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      },
      body: "grant_type=client_credentials",
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { access_token: string; expires_in: number };
    spotifyToken = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  } catch {
    return null;
  }
}

async function searchSpotifyTrack(query: string, token: string): Promise<any | null> {
  try {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
    const resp = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    if (!resp.ok) return null;
    const data = await resp.json() as { tracks?: { items: any[] } };
    return data.tracks?.items?.[0] ?? null;
  } catch {
    return null;
  }
}

async function getArtistTopTrack(artistName: string, token: string): Promise<any | null> {
  try {
    // Search for artist
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;
    const searchResp = await fetch(searchUrl, { headers: { Authorization: "Bearer " + token } });
    if (!searchResp.ok) return null;
    const searchData = await searchResp.json() as { artists?: { items: any[] } };
    const artist = searchData.artists?.items?.[0];
    if (!artist?.id) return null;

    // Get top tracks
    const tracksUrl = `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=PT`;
    const tracksResp = await fetch(tracksUrl, { headers: { Authorization: "Bearer " + token } });
    if (!tracksResp.ok) return null;
    const tracksData = await tracksResp.json() as { tracks: any[] };
    const tracks = tracksData.tracks?.filter((t) => t?.preview_url || t?.external_urls?.spotify);
    if (!tracks?.length) return null;

    // Pick a random track (not always the #1)
    const randomTrack = tracks[Math.floor(Math.random() * Math.min(tracks.length, 5))];
    return {
      ...randomTrack,
      artistImage: artist.images?.[0]?.url,
    };
  } catch {
    return null;
  }
}

export const recommendationsRouter = createRouter({
  // Get recommendations by mood
  byMood: publicQuery
    .input(z.object({ mood: z.string(), limit: z.number().min(1).max(20).default(6) }))
    .query(async ({ input }) => {
      console.log(`[Recommendations] Requested mood: ${input.mood}`);

      // Seed on first call
      await seedArtists();

      const db = getDb();
      const token = await getSpotifyToken();
      console.log(`[Recommendations] Spotify token: ${token ? "OK" : "NOT SET"}`);

      // Get artists for this mood from DB, fallback to static data
      let artists: any[] = [];
      try {
        artists = await db
          .select()
          .from(schema.moodArtists)
          .where(eq(schema.moodArtists.mood, input.mood));
        console.log(`[Recommendations] Found ${artists.length} artists in DB for ${input.mood}`);
      } catch (err: any) {
        console.error("[Recommendations] DB error:", err.message);
        // Fallback to static data
        const staticArtists = MOOD_ARTISTS[input.mood];
        if (staticArtists) {
          artists = staticArtists.map((a, i) => ({
            id: i + 1,
            mood: input.mood,
            name: a.name,
            category: a.category,
            genres: JSON.stringify(a.genres),
            image: null,
          }));
          console.log(`[Recommendations] Using ${artists.length} static artists`);
        }
      }

      if (artists.length === 0) {
        return { tracks: [], mood: input.mood };
      }

      // Shuffle and pick
      const shuffled = [...artists].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, input.limit);

      // Fetch real tracks from Spotify
      const tracks: any[] = [];
      for (const artist of selected) {
        if (token) {
          const track = await getArtistTopTrack(artist.name, token);
          if (track) {
            tracks.push({
              id: track.id,
              title: track.name,
              artist: track.artists?.map((a: any) => a.name).join(", "),
              image: track.album?.images?.[0]?.url || track.artistImage,
              previewUrl: track.preview_url,
              spotifyUrl: track.external_urls?.spotify,
              spotifyId: track.id,
              album: track.album?.name,
              artistCategory: artist.category,
              artistGenres: artist.genres ? JSON.parse(artist.genres) : [],
            });
            continue;
          }
        }
        // Fallback: return artist info
        tracks.push({
          id: `artist-${artist.id}`,
          title: `Top tracks de ${artist.name}`,
          artist: artist.name,
          image: artist.image,
          previewUrl: null,
          spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`,
          spotifyId: null,
          album: null,
          artistCategory: artist.category,
          artistGenres: artist.genres ? JSON.parse(artist.genres) : [],
        });
      }

      console.log(`[Recommendations] Returning ${tracks.length} tracks`);
      return { tracks, mood: input.mood };
    }),

  // Get available moods with artist counts
  moods: publicQuery.query(async () => {
    await seedArtists();
    const db = getDb();

    try {
      const rows = await db
        .select({
          mood: schema.moodArtists.mood,
          total: sql<number>`count(*)`,
          famous: sql<number>`sum(case when ${schema.moodArtists.category} = 'famous' then 1 else 0 end)`,
          underground: sql<number>`sum(case when ${schema.moodArtists.category} = 'underground' then 1 else 0 end)`,
        })
        .from(schema.moodArtists)
        .groupBy(schema.moodArtists.mood);
      return rows;
    } catch (err: any) {
      console.error("[Recommendations] moods error:", err.message);
      // Return static counts
      return Object.entries(MOOD_ARTISTS).map(([mood, artists]) => ({
        mood,
        total: artists.length,
        famous: artists.filter((a) => a.category === "famous").length,
        underground: artists.filter((a) => a.category === "underground").length,
      }));
    }
  }),

  // Debug: check if recommendations are working
  debug: publicQuery.query(async () => {
    const db = getDb();
    let dbStatus = "unknown";
    let artistCount = 0;

    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(schema.moodArtists);
      artistCount = result[0]?.count ?? 0;
      dbStatus = "connected";
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }

    const spotifyToken = await getSpotifyToken();

    return {
      dbStatus,
      artistCount,
      spotifyConfigured: !!spotifyToken,
      moodsAvailable: Object.keys(MOOD_ARTISTS),
      totalStaticArtists: Object.values(MOOD_ARTISTS).flat().length,
    };
  }),
});
