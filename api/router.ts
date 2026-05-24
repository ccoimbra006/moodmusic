import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { googleAuthRouter } from "./google-auth-router";
import { usersRouter } from "./users-router";
import { spotifyRouter } from "./spotify-router";
import { songsRouter } from "./songs-router";
import { likesRouter } from "./likes-router";
import { favoritesRouter } from "./favorites-router";
import { commentsRouter } from "./comments-router";
import { moodsRouter } from "./moods-router";
import { historyRouter } from "./history-router";
import { followsRouter } from "./follows-router";
import { timelineRouter } from "./timeline-router";
import { streaksRouter } from "./streaks-router";
import { badgesRouter } from "./badges-router";
import { notificationsRouter } from "./notifications-router";
import { pollsRouter } from "./polls-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  googleAuth: googleAuthRouter,
  users: usersRouter,
  spotify: spotifyRouter,
  songs: songsRouter,
  likes: likesRouter,
  favorites: favoritesRouter,
  comments: commentsRouter,
  moods: moodsRouter,
  history: historyRouter,
  follows: followsRouter,
  timeline: timelineRouter,
  streaks: streaksRouter,
  badges: badgesRouter,
  notifications: notificationsRouter,
  polls: pollsRouter,
});

export type AppRouter = typeof appRouter;
