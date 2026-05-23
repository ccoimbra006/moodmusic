function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`[ENV] WARNING: ${name} is not set, using empty string`);
  }
  return value ?? "";
}

const appSecret = getEnv("APP_SECRET");
const databaseUrl = getEnv("DATABASE_URL");

// Debug logging for Windows environment issues
if (!appSecret) {
  console.error("[ENV] WARNING: APP_SECRET is empty! Check your .env file.");
}
if (!databaseUrl) {
  console.error("[ENV] WARNING: DATABASE_URL is empty! Using SQLite fallback.");
}

export const env = {
  appSecret,
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl,
  appId: process.env.APP_ID ?? "",
  kimiAuthUrl: process.env.KIMI_AUTH_URL ?? "",
  kimiOpenUrl: process.env.KIMI_OPEN_URL ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID ?? "",
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
};
