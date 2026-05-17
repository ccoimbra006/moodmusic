import { z } from "zod";
import { createRouter, adminQuery, publicQuery } from "./middleware";
import { env } from "./lib/env";
import { detectMoodFromText } from "./mood-detector";

let spotifyAccessToken: string | null = null;
let spotifyTokenExpiry: number | null = null;

export async function getSpotifyToken(): Promise<string> {
  if (spotifyAccessToken && spotifyTokenExpiry && Date.now() < spotifyTokenExpiry - 300000) {
    return spotifyAccessToken;
  }

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(env.spotifyClientId + ":" + env.spotifyClientSecret).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!resp.ok) {
    throw new Error("Failed to get Spotify token: " + (await resp.text()));
  }

  const data = await resp.json() as { access_token: string; expires_in: number };
  spotifyAccessToken = data.access_token;
  spotifyTokenExpiry = Date.now() + data.expires_in * 1000;
  return spotifyAccessToken;
}

export function detectMood(energy: number, valence: number, title?: string, artist?: string): string {
  // energy: 0 = calm, 1 = intense
  // valence: 0 = sad/negative, 1 = happy/positive
  
  // Happy: high energy + positive vibes
  if (energy > 0.6 && valence > 0.6) return "happy";
  
  // Energy: high energy but not necessarily happy (intense, workout, party)
  if (energy > 0.7) return "energy";
  
  // Romantic: medium energy + positive + moderate intensity
  if (energy >= 0.3 && energy <= 0.6 && valence > 0.55) return "romantic";
  
  // Focus: low-mid energy + neutral/slightly positive (concentration music)
  if (energy >= 0.25 && energy < 0.5 && valence >= 0.35 && valence <= 0.6) return "focus";
  
  // Melancholy: low energy + negative/sad
  if (energy < 0.4 && valence < 0.4) return "melancholy";
  
  // Chill: low energy + positive/relaxed (default for calm positive music)
  if (energy < 0.5 && valence > 0.4) return "chill";
  
  // Fallback: try AI text detection if audio features are ambiguous
  if (title && artist) {
    const textMood = detectMoodFromText(title, artist);
    if (textMood) return textMood;
  }
  
  // Default
  return "chill";
}

// Fallback: Spotify restricted audio-features API. Use track metadata instead.
export async function getAudioFeatures(trackId: string, token: string) {
  // Try audio-features first (may work for some tracks/apps)
  const res = await fetch(
    `https://api.spotify.com/v1/audio-features/${trackId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.ok) {
    return res.json() as Promise<{ energy: number; valence: number }>;
  }
  
  // If 403/404, fallback to track metadata for mood estimation
  console.warn(`[Spotify] audio-features/${trackId} returned ${res.status}, using fallback`);
  
  const trackRes = await fetch(
    `https://api.spotify.com/v1/tracks/${trackId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!trackRes.ok) {
    console.error(`[Spotify] Track fetch also failed: ${trackRes.status}`);
    return null;
  }
  
  const trackJson = await trackRes.json() as Record<string, unknown>;
  console.log("[Spotify] Track data keys:", Object.keys(trackJson).join(", "));
  
  const track = trackJson as { popularity?: number; duration_ms?: number; explicit?: boolean; name?: string };
  
  // If popularity is missing, return null (will use default mood)
  if (typeof track.popularity !== "number") {
    console.warn("[Spotify] No popularity data, using default mood");
    return null;
  }
  
  // Estimate energy/valence from popularity and other metadata
  // popularity 0-100 maps to energy 0.2-0.8
  const estimatedEnergy = 0.2 + (track.popularity / 100) * 0.6;
  // Assume neutral-positive valence for popular tracks
  const estimatedValence = 0.4 + (track.popularity / 100) * 0.4;
  
  console.log(`[Spotify] Estimated energy=${estimatedEnergy.toFixed(2)}, valence=${estimatedValence.toFixed(2)} from popularity=${track.popularity}`);
  
  return { energy: estimatedEnergy, valence: estimatedValence };
}

export const spotifyRouter = createRouter({
  search: adminQuery
    .input(z.object({ q: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const token = await getSpotifyToken();
      const resp = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(input.q)}&type=track&limit=10&market=BR`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!resp.ok) {
        throw new Error("Spotify search failed");
      }

      const data = await resp.json() as {
        tracks?: {
          items: Array<{
            id: string;
            name: string;
            artists: Array<{ name: string }>;
            album: { name: string; images: Array<{ url: string }> };
            external_urls: { spotify: string };
            preview_url: string | null;
          }>;
        };
      };

      const tracks = data.tracks?.items?.map((track) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        image: track.album.images[0]?.url,
        spotifyUrl: track.external_urls.spotify,
        previewUrl: track.preview_url,
      })) ?? [];

      return { tracks };
    }),

  getTrack: publicQuery
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const token = await getSpotifyToken();
      const resp = await fetch(
        `https://api.spotify.com/v1/tracks/${input.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!resp.ok) {
        throw new Error("Spotify track fetch failed");
      }

      const track = await resp.json() as {
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: { name: string; images: Array<{ url: string }> };
        external_urls: { spotify: string };
        preview_url: string | null;
      };

      return {
        id: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        image: track.album.images[0]?.url,
        spotifyUrl: track.external_urls.spotify,
        previewUrl: track.preview_url,
      };
    }),

  getAudioFeatures: adminQuery
    .input(z.object({ trackId: z.string() }))
    .query(async ({ input }) => {
      const token = await getSpotifyToken();
      const features = await getAudioFeatures(input.trackId, token);
      if (!features) return null;
      const mood = detectMood(features.energy, features.valence);
      return {
        energy: features.energy,
        valence: features.valence,
        mood,
      };
    }),
});
