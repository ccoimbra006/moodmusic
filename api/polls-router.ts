import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import * as schema from "@db/schema";

export const pollsRouter = createRouter({
  // Get active poll
  getActive: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const rows = await db
      .select()
      .from(schema.moodPolls)
      .where(sql`${schema.moodPolls.endsAt} > ${now.toISOString()}`)
      .orderBy(desc(schema.moodPolls.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }),

  // Get all polls (admin)
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(schema.moodPolls).orderBy(desc(schema.moodPolls.createdAt));
  }),

  // Create poll (admin)
  create: authedQuery
    .input(
      z.object({
        question: z.string().min(1),
        options: z.string(), // JSON array
        endsAt: z.string(), // ISO date
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin only");
      const db = getDb();
      const result = await db.insert(schema.moodPolls).values({
        question: input.question,
        options: input.options,
        endsAt: new Date(input.endsAt),
        createdBy: ctx.user.id,
      }).returning();
      return result[0];
    }),

  // Vote
  vote: authedQuery
    .input(
      z.object({
        pollId: z.number(),
        option: z.string().max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Check if already voted
      const existing = await db
        .select()
        .from(schema.moodVotes)
        .where(
          eq(schema.moodVotes.pollId, input.pollId) &&
          eq(schema.moodVotes.userId, ctx.user.id)
        );

      if (existing.length > 0) {
        return { voted: false, error: "Already voted" };
      }

      await db.insert(schema.moodVotes).values({
        pollId: input.pollId,
        userId: ctx.user.id,
        option: input.option,
      });

      return { voted: true };
    }),

  // Get poll results
  results: publicQuery
    .input(z.object({ pollId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const votes = await db
        .select({
          option: schema.moodVotes.option,
          count: sql<number>`count(*)`,
        })
        .from(schema.moodVotes)
        .where(eq(schema.moodVotes.pollId, input.pollId))
        .groupBy(schema.moodVotes.option);

      const total = votes.reduce((sum, v) => sum + v.count, 0);
      return { votes, total };
    }),

  // Check if user voted
  myVote: authedQuery
    .input(z.object({ pollId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.moodVotes)
        .where(
          eq(schema.moodVotes.pollId, input.pollId) &&
          eq(schema.moodVotes.userId, ctx.user.id)
        )
        .limit(1);
      return rows[0] ?? null;
    }),
});
