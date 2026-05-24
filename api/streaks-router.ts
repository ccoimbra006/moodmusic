import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const streaksRouter = createRouter({
  // Public: get any user's streak
  get: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.userStreaks)
        .where(eq(schema.userStreaks.userId, input.userId));
      return rows[0] ?? null;
    }),

  // Track visit (increments streak) - call when user opens the site
  trackVisit: authedQuery
    .mutation(async ({ ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const existing = await db
        .select()
        .from(schema.userStreaks)
        .where(eq(schema.userStreaks.userId, userId));

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (existing.length > 0) {
        const streak = existing[0];
        const lastVisit = new Date(streak.lastVisitDate);
        const lastVisitDay = new Date(lastVisit.getFullYear(), lastVisit.getMonth(), lastVisit.getDate());

        const diffMs = today.getTime() - lastVisitDay.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        let newCurrent = streak.currentStreak;
        let newLongest = streak.longestStreak;

        if (diffDays === 1) {
          // Visited yesterday - increment streak
          newCurrent = streak.currentStreak + 1;
          if (newCurrent > newLongest) newLongest = newCurrent;
        } else if (diffDays === 0) {
          // Already visited today - do nothing
        } else {
          // Missed a day - reset streak
          newCurrent = 1;
        }

        await db
          .update(schema.userStreaks)
          .set({
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastVisitDate: now,
            updatedAt: now,
          })
          .where(eq(schema.userStreaks.userId, userId));

        return { currentStreak: newCurrent, longestStreak: newLongest };
      } else {
        // First visit ever
        await db.insert(schema.userStreaks).values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastVisitDate: now,
        });
        return { currentStreak: 1, longestStreak: 1 };
      }
    }),

  // Leaderboard: top streaks
  leaderboard: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        userId: schema.userStreaks.userId,
        currentStreak: schema.userStreaks.currentStreak,
        longestStreak: schema.userStreaks.longestStreak,
        name: schema.users.name,
        avatar: schema.users.avatar,
      })
      .from(schema.userStreaks)
      .innerJoin(schema.users, eq(schema.userStreaks.userId, schema.users.id))
      .orderBy(sql`${schema.userStreaks.currentStreak} DESC`)
      .limit(10);
    return rows;
  }),
});
