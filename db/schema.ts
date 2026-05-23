import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: text("unionId", { length: 255 }).unique(),
  googleId: text("googleId", { length: 255 }).unique(),
  email: text("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash", { length: 255 }),
  name: text("name", { length: 255 }),
  avatar: text("avatar"),
  role: text("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignInAt: timestamp("lastSignInAt", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotifyId", { length: 255 }).notNull().unique(),
  title: text("title", { length: 255 }).notNull(),
  artist: text("artist", { length: 255 }).notNull(),
  album: text("album", { length: 255 }),
  image: text("image"),
  spotifyUrl: text("spotifyUrl"),
  description: text("description"),
  detectedMood: text("detectedMood", { length: 50 }),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  addedBy: integer("addedBy").references(() => users.id),
  likesCount: integer("likesCount").default(0),
  commentsCount: integer("commentsCount").default(0),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  songId: integer("songId").notNull().references(() => songs.id),
  userId: integer("userId").notNull().references(() => users.id),
  type: text("type", { length: 20 }).default("like").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  songId: integer("songId").notNull().references(() => songs.id),
  userId: integer("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  songId: integer("songId").notNull().references(() => songs.id),
  userId: integer("userId").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;

export const commentReplies = pgTable("commentReplies", {
  id: serial("id").primaryKey(),
  commentId: integer("commentId").notNull().references(() => comments.id),
  userId: integer("userId").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type CommentReply = typeof commentReplies.$inferSelect;

export const moodSelections = pgTable("moodSelections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  songId: integer("songId").notNull().references(() => songs.id),
  mood: text("mood", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type MoodSelection = typeof moodSelections.$inferSelect;

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("followerId").notNull().references(() => users.id),
  followingId: integer("followingId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;

export const userActivity = pgTable("userActivity", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  songId: integer("songId").references(() => songs.id),
  action: text("action", { length: 30 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type UserActivity = typeof userActivity.$inferSelect;
