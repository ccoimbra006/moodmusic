import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  unionId: text("unionId", { length: 255 }).unique(),
  googleId: text("googleId", { length: 255 }).unique(),
  email: text("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash", { length: 255 }),
  name: text("name", { length: 255 }),
  avatar: text("avatar"),
  role: text("role", { length: 20 }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  lastSignInAt: integer("lastSignInAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const songs = sqliteTable("songs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  spotifyId: text("spotifyId", { length: 255 }).notNull().unique(),
  title: text("title", { length: 255 }).notNull(),
  artist: text("artist", { length: 255 }).notNull(),
  album: text("album", { length: 255 }),
  image: text("image"),
  spotifyUrl: text("spotifyUrl"),
  description: text("description"),
  detectedMood: text("detectedMood", { length: 50 }),
  date: integer("date", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  addedBy: integer("addedBy", { mode: "number" }).references(() => users.id),
  likesCount: integer("likesCount").default(0),
  commentsCount: integer("commentsCount").default(0),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

export const likes = sqliteTable("likes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  songId: integer("songId", { mode: "number" }).notNull().references(() => songs.id),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  type: text("type", { length: 20 }).default("like").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Like = typeof likes.$inferSelect;

export const favorites = sqliteTable("favorites", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  songId: integer("songId", { mode: "number" }).notNull().references(() => songs.id),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Favorite = typeof favorites.$inferSelect;

export const comments = sqliteTable("comments", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  songId: integer("songId", { mode: "number" }).notNull().references(() => songs.id),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Comment = typeof comments.$inferSelect;

export const commentReplies = sqliteTable("commentReplies", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  commentId: integer("commentId", { mode: "number" }).notNull().references(() => comments.id),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type CommentReply = typeof commentReplies.$inferSelect;

export const moodSelections = sqliteTable("moodSelections", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  songId: integer("songId", { mode: "number" }).notNull().references(() => songs.id),
  mood: text("mood", { length: 50 }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type MoodSelection = typeof moodSelections.$inferSelect;

export const follows = sqliteTable("follows", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  followerId: integer("followerId", { mode: "number" }).notNull().references(() => users.id),
  followingId: integer("followingId", { mode: "number" }).notNull().references(() => users.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Follow = typeof follows.$inferSelect;

export const userActivity = sqliteTable("userActivity", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id),
  songId: integer("songId", { mode: "number" }).references(() => songs.id),
  action: text("action", { length: 30 }).notNull(),
  metadata: text("metadata"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type UserActivity = typeof userActivity.$inferSelect;
