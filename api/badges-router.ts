import { eq } from "drizzle-orm";
import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const BADGE_DEFINITIONS = [
  { id: "first_visit", name: "Primeiro Passo", desc: "Visitou o site pela primeira vez", emoji: "🌟" },
  { id: "streak_3", name: "Em Racha", desc: "3 dias seguidos no site", emoji: "🔥" },
  { id: "streak_7", name: "Semana Completa", desc: "7 dias seguidos no site", emoji: "📅" },
  { id: "streak_30", name: "Viciado", desc: "30 dias seguidos no site", emoji: "🏆" },
  { id: "first_comment", name: "Opiniao Expressa", desc: "Deixou o primeiro comentario", emoji: "💬" },
  { id: "first_like", name: "Curioso", desc: "Deu o primeiro like", emoji: "❤️" },
  { id: "comment_10", name: "Comentador", desc: "10 comentarios feitos", emoji: "🗣️" },
  { id: "like_50", name: "Apreciador", desc: "50 likes dados", emoji: "💖" },
  { id: "follower_5", name: "Influenciador", desc: "5 seguidores", emoji: "🌟" },
  { id: "poll_voter", name: "Democrata", desc: "Votou numa enquete", emoji: "🗳️" },
];

export const badgesRouter = createRouter({
  // Get user's badges
  getMine: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.userBadges)
      .where(eq(schema.userBadges.userId, ctx.user.id));
    return rows;
  }),

  // Get public badges for a user
  getByUser: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.userBadges)
        .where(eq(schema.userBadges.userId, input.userId));
      return rows;
    }),

  // Award a badge (internal use or admin)
  award: authedQuery
    .input(z.object({ badge: z.string().max(50) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check if already earned
      const existing = await db
        .select()
        .from(schema.userBadges)
        .where(
          eq(schema.userBadges.userId, userId) &&
          eq(schema.userBadges.badge, input.badge)
        );

      if (existing.length > 0) return { awarded: false, alreadyHad: true };

      await db.insert(schema.userBadges).values({
        userId,
        badge: input.badge,
      });

      return { awarded: true, badge: input.badge };
    }),

  // Get all badge definitions
  definitions: publicQuery.query(() => {
    return BADGE_DEFINITIONS;
  }),
});
